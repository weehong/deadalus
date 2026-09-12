import { Prisma } from "@prisma/client";
import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";

interface CatalogueRecord {
	id: string;
	projectId: string;
	name: string;
	nameKey: string;
}
interface ItemRow {
	unitId: string;
	catalogueItemId: string;
	progression: number;
	entryCount: number;
}
let records: Array<CatalogueRecord>;
let items: Array<ItemRow>;
const findUnique = vi.fn();
const findFirst = vi.fn();
const create = vi.fn();
const update = vi.fn();
const remove = vi.fn();
const count = vi.fn();
const findMany = vi.fn();
const database = {
	project: { findUnique },
	catalogueItem: { findFirst, create, update, delete: remove },
	item: { count, findMany },
};
vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		...database,
		$transaction: async (callback: (tx: typeof database) => Promise<unknown>) =>
			callback(database),
	},
}));
let app: import("express").Application;
let token: string;
beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	token = await sign(key);
	const { createApp } = await import("@/app.js");
	app = createApp();
});
afterAll(() => vi.unstubAllGlobals());
const structure = [
	{
		id: "b1",
		name: "A",
		position: 0,
		storeys: [
			{
				id: "s1",
				name: "01",
				position: 0,
				units: [
					{ id: "u1", name: "01", position: 0, unitTypeId: null },
					{ id: "u2", name: "02", position: 1, unitTypeId: null },
				],
			},
			{
				id: "s2",
				name: "02",
				position: 1,
				units: [{ id: "u3", name: "01", position: 0, unitTypeId: null }],
			},
		],
	},
	{ id: "b2", name: "B", position: 1, storeys: [] },
];
beforeEach(() => {
	for (const mock of [
		findUnique,
		findFirst,
		create,
		update,
		remove,
		count,
		findMany,
	])
		mock.mockReset();
	records = [];
	items = [];
	findUnique.mockImplementation(async ({ where }: { where: { id: string } }) =>
		where.id === "p1" || where.id === "p2"
			? {
					id: where.id,
					name: "Gardens",
					code: "EG2",
					blocks: where.id === "p1" ? structure : [],
					unitTypes: [],
					catalogueItems: records
						.filter((r) => r.projectId === where.id)
						.sort(
							(a, b) =>
								a.nameKey.localeCompare(b.nameKey) || a.id.localeCompare(b.id)
						)
						.map(({ id, name }) => ({
							id,
							name,
							_count: {
								items: items.filter((item) => item.catalogueItemId === id)
									.length,
							},
						})),
				}
			: null
	);
	findMany.mockImplementation(async () =>
		items.map(({ unitId, catalogueItemId, progression, entryCount }) => ({
			unitId,
			catalogueItemId,
			subcontractorId: null,
			progression,
			_count: { entries: entryCount },
		}))
	);
	findFirst.mockImplementation(
		async ({ where }: { where: { id: string; projectId: string } }) =>
			records.find(
				(r) => r.id === where.id && r.projectId === where.projectId
			) ?? null
	);
	const clash = (data: Partial<CatalogueRecord>, id?: string): void => {
		if (
			records.some(
				(r) =>
					r.id !== id &&
					r.projectId === data.projectId &&
					r.nameKey === data.nameKey
			)
		)
			throw new Prisma.PrismaClientKnownRequestError("duplicate", {
				code: "P2002",
				clientVersion: "test",
				meta: { target: ["projectId", "nameKey"] },
			});
	};
	create.mockImplementation(
		async ({ data }: { data: Omit<CatalogueRecord, "id"> }) => {
			clash(data);
			const record = { ...data, id: `item-${records.length + 1}` };
			records.push(record);
			return record;
		}
	);
	update.mockImplementation(
		async ({
			where,
			data,
		}: {
			where: { id: string; projectId: string };
			data: Partial<CatalogueRecord>;
		}) => {
			const record = records.find(
				(r) => r.id === where.id && r.projectId === where.projectId
			)!;
			clash({ ...data, projectId: record.projectId }, record.id);
			Object.assign(record, data);
			return record;
		}
	);
	count.mockImplementation(
		async ({ where }: { where: { catalogueItemId: string } }) =>
			items.filter((item) => item.catalogueItemId === where.catalogueItemId)
				.length
	);
	remove.mockImplementation(
		async ({ where }: { where: { id: string; projectId: string } }) => {
			records = records.filter(
				(r) => !(r.id === where.id && r.projectId === where.projectId)
			);
			return {};
		}
	);
});
const read = (projectId = "p1"): request.Test =>
	request(app)
		.get(`/api/v1/projects/${projectId}`)
		.set("Authorization", `Bearer ${token}`);
const add = (body: object, projectId = "p1"): request.Test =>
	request(app)
		.post(`/api/v1/projects/${projectId}/catalogue-items`)
		.set("Authorization", `Bearer ${token}`)
		.send(body);
const rename = (body: object, projectId = "p1", id = "item-1"): request.Test =>
	request(app)
		.patch(`/api/v1/projects/${projectId}/catalogue-items/${id}`)
		.set("Authorization", `Bearer ${token}`)
		.send(body);
const deleteItem = (projectId = "p1", id = "item-1"): request.Test =>
	request(app)
		.delete(`/api/v1/projects/${projectId}/catalogue-items/${id}`)
		.set("Authorization", `Bearer ${token}`);
const noItems = { itemCount: 0, entryCount: 0, progression: null };
it("reads a Project with an empty Item Catalogue and no Progression at any level", async () => {
	const response = await read();
	expect(response.status).toBe(200);
	expect(response.body).toEqual({
		data: {
			id: "p1",
			name: "Gardens",
			code: "EG2",
			...noItems,
			catalogueItems: [],
			unitTypes: [],
			blocks: [
				{
					id: "b1",
					name: "A",
					position: 0,
					...noItems,
					storeys: [
						{
							id: "s1",
							name: "01",
							position: 0,
							...noItems,
							units: [
								{
									id: "u1",
									name: "01",
									position: 0,
									unitTypeId: null,
									...noItems,
									items: [],
								},
								{
									id: "u2",
									name: "02",
									position: 1,
									unitTypeId: null,
									...noItems,
									items: [],
								},
							],
						},
						{
							id: "s2",
							name: "02",
							position: 1,
							...noItems,
							units: [
								{
									id: "u3",
									name: "01",
									position: 0,
									unitTypeId: null,
									...noItems,
									items: [],
								},
							],
						},
					],
				},
				{ id: "b2", name: "B", position: 1, ...noItems, storeys: [] },
			],
		},
	});
});
it("averages Item Progression beneath every level and counts Items and entries", async () => {
	records.push({
		id: "item-1",
		projectId: "p1",
		name: "Sink",
		nameKey: "sink",
	});
	items = [
		{
			unitId: "u1",
			catalogueItemId: "item-1",
			progression: 100,
			entryCount: 2,
		},
		{ unitId: "u1", catalogueItemId: "item-2", progression: 50, entryCount: 1 },
		{ unitId: "u3", catalogueItemId: "item-1", progression: 0, entryCount: 0 },
	];
	const { body } = await read();
	expect(body.data).toMatchObject({
		itemCount: 3,
		entryCount: 3,
		progression: 50,
		catalogueItems: [{ id: "item-1", name: "Sink", itemCount: 2 }],
	});
	const [a, b] = body.data.blocks;
	expect(a).toMatchObject({ itemCount: 3, entryCount: 3, progression: 50 });
	expect(b).toMatchObject(noItems);
	expect(a.storeys[0]).toMatchObject({
		itemCount: 2,
		entryCount: 3,
		progression: 75,
	});
	expect(a.storeys[0].units[0]).toMatchObject({
		itemCount: 2,
		entryCount: 3,
		progression: 75,
	});
	expect(a.storeys[0].units[1]).toMatchObject(noItems);
	expect(a.storeys[1]).toMatchObject({
		itemCount: 1,
		entryCount: 0,
		progression: 0,
	});
});
it("adds a Catalogue Item, trimming the name, and returns the full Project ordered by name key", async () => {
	await add({ name: "Wardrobe" });
	const response = await add({ name: "  Kitchen   cabinet " });
	expect(response.status).toBe(201);
	expect(response.body.data).toMatchObject({
		id: "p1",
		itemCount: 0,
		progression: null,
		catalogueItems: [
			{ id: "item-2", name: "Kitchen   cabinet", itemCount: 0 },
			{ id: "item-1", name: "Wardrobe", itemCount: 0 },
		],
	});
});
it.each([" kitchen  CABINET ", "Kitchen\tcabinet", "KITCHEN CABINET"])(
	"rejects a name differing only by case or whitespace: %j",
	async (name) => {
		await add({ name: "Kitchen cabinet" });
		const response = await add({ name });
		expect(response.status).toBe(409);
		expect(response.body.error.code).toBe("CATALOGUE_ITEM_NAME_TAKEN");
	}
);
it.each([{}, { name: " " }, { name: "a".repeat(61) }, { name: 3 }])(
	"rejects an invalid name: %j",
	async (body) => {
		expect((await add(body)).status).toBe(400);
		expect(create).not.toHaveBeenCalled();
	}
);
it("allows the same name in another Project and rejects an unknown Project", async () => {
	await add({ name: "Sink" });
	expect((await add({ name: "sink" }, "p2")).status).toBe(201);
	expect((await add({ name: "Sink" }, "missing")).status).toBe(404);
});
it("renames a Catalogue Item and returns the full Project", async () => {
	await add({ name: "Sink" });
	const response = await rename({ name: " Kitchen sink " });
	expect(response.status).toBe(200);
	expect(response.body.data.catalogueItems).toEqual([
		{ id: "item-1", name: "Kitchen sink", itemCount: 0 },
	]);
});
it("refuses a taken rename, an invalid name and a Catalogue Item of another Project", async () => {
	await add({ name: "Sink" });
	await add({ name: "Wardrobe" });
	const clash = await rename({ name: "wardrobe " });
	expect(clash.status).toBe(409);
	expect(clash.body.error.code).toBe("CATALOGUE_ITEM_NAME_TAKEN");
	expect((await rename({ name: "Sink" })).status).toBe(200);
	expect((await rename({ name: "" })).status).toBe(400);
	expect((await rename({})).status).toBe(400);
	expect((await rename({ name: "Basin" }, "p2")).status).toBe(404);
	expect((await rename({ name: "Basin" }, "p1", "missing")).status).toBe(404);
});
it("refuses deleting a Catalogue Item while Units hold Items made from it, then deletes", async () => {
	await add({ name: "Sink" });
	items = [
		{ unitId: "u1", catalogueItemId: "item-1", progression: 0, entryCount: 0 },
		{ unitId: "u2", catalogueItemId: "item-1", progression: 0, entryCount: 0 },
	];
	const refused = await deleteItem();
	expect(refused.status).toBe(409);
	expect(refused.body.error).toMatchObject({
		code: "CATALOGUE_ITEM_IN_USE",
		details: { itemCount: 2 },
	});
	expect(remove).not.toHaveBeenCalled();
	items = [];
	expect((await deleteItem()).status).toBe(204);
	expect((await deleteItem()).status).toBe(404);
});
it("does not delete another Project's Catalogue Item", async () => {
	await add({ name: "Sink" });
	expect((await deleteItem("p2")).status).toBe(404);
	expect((await deleteItem()).status).toBe(204);
});
it("reports the current count if an Item is made between the precheck and the delete", async () => {
	await add({ name: "Sink" });
	remove.mockImplementationOnce(async () => {
		items = [
			{
				unitId: "u1",
				catalogueItemId: "item-1",
				progression: 0,
				entryCount: 0,
			},
		];
		throw new Prisma.PrismaClientKnownRequestError("restricted", {
			code: "P2003",
			clientVersion: "test",
		});
	});
	const response = await deleteItem();
	expect(response.status).toBe(409);
	expect(response.body.error).toMatchObject({
		code: "CATALOGUE_ITEM_IN_USE",
		details: { itemCount: 1 },
	});
});
it.each(["post", "patch", "delete"] as const)(
	"requires a verified Session for %s",
	async (method) => {
		const path =
			method === "post"
				? "/api/v1/projects/p1/catalogue-items"
				: "/api/v1/projects/p1/catalogue-items/item-1";
		expect(
			(await request(app)[method](path).send({ name: "Sink" })).status
		).toBe(401);
	}
);
it("documents all Catalogue Item mutations with auth and their responses", async () => {
	const response = await request(app).get("/openapi.json");
	for (const [method, path, status] of [
		["post", "/api/v1/projects/{id}/catalogue-items", 201],
		["patch", "/api/v1/projects/{id}/catalogue-items/{catalogueItemId}", 200],
		["delete", "/api/v1/projects/{id}/catalogue-items/{catalogueItemId}", 204],
	] as const) {
		const operation = response.body.paths[path]?.[method];
		expect(operation).toBeDefined();
		expect(operation.security).toEqual([{ bearerAuth: [] }]);
		for (const code of [status, 400, 401, 404, 409])
			expect(operation.responses).toHaveProperty(String(code));
	}
	const project = response.body.components.schemas.Project;
	expect(project.properties).toHaveProperty("catalogueItems");
	for (const field of ["itemCount", "entryCount", "progression"])
		expect(project.properties).toHaveProperty(field);
});
