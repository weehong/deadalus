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

// The Field's Project reads over HTTP with Prisma faked at the boundary. The
// fakes honour the scope each query sends (the Subcontractor, the Project ids)
// so a read that forgot to filter would leak another company's Items here.

interface MemberRecord {
	id: string;
	name: string;
	subcontractor: { id: string; name: string };
}
interface ItemRecord {
	unitId: string;
	catalogueItemId: string;
	subcontractorId: string | null;
	progression: number;
	entryCount: number;
	projectId: string;
}
interface ProjectRecord {
	id: string;
	code: string;
	name: string;
	nameKey: string;
	blocks: Array<{
		id: string;
		name: string;
		position: number;
		storeys: Array<{
			id: string;
			name: string;
			position: number;
			units: Array<{ id: string; name: string; position: number }>;
		}>;
	}>;
}

const memberFindUnique = vi.fn();
const projectFindMany = vi.fn();
const projectFindUnique = vi.fn();
const itemFindMany = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: {
		member: { findUnique: memberFindUnique },
		project: { findMany: projectFindMany, findUnique: projectFindUnique },
		item: { findMany: itemFindMany },
	},
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
	{
		id: "cass",
		name: "Cass Ng",
		subcontractor: { id: "idle", name: "Idle Works" },
	},
];

const unit = (
	id: string,
	position: number
): { id: string; name: string; position: number } => ({
	id,
	name: id.toUpperCase(),
	position,
});

const projects: Array<ProjectRecord> = [
	{
		id: "gardens",
		code: "EG2",
		name: "Gardens",
		nameKey: "gardens",
		blocks: [
			{
				id: "a",
				name: "A",
				position: 0,
				storeys: [
					{
						id: "a1",
						name: "01",
						position: 0,
						units: [unit("u1", 0), unit("u2", 1)],
					},
					{ id: "a2", name: "02", position: 1, units: [unit("u3", 0)] },
					{ id: "a3", name: "03", position: 2, units: [unit("u7", 0)] },
				],
			},
			{
				id: "b",
				name: "B",
				position: 1,
				storeys: [
					{ id: "b1", name: "01", position: 0, units: [unit("u4", 0)] },
				],
			},
		],
	},
	{
		id: "aurora",
		code: "AUR",
		name: "Aurora",
		nameKey: "aurora",
		blocks: [
			{
				id: "c",
				name: "C",
				position: 0,
				storeys: [{ id: "c1", name: "G", position: 0, units: [unit("u5", 0)] }],
			},
		],
	},
	{
		id: "zeta",
		code: "ZT",
		name: "Zeta",
		nameKey: "zeta",
		blocks: [
			{
				id: "d",
				name: "D",
				position: 0,
				storeys: [
					{ id: "d1", name: "01", position: 0, units: [unit("u6", 0)] },
				],
			},
		],
	},
];

const item = (
	projectId: string,
	unitId: string,
	catalogueItemId: string,
	subcontractorId: string | null,
	progression: number,
	entryCount = 0
): ItemRecord => ({
	projectId,
	unitId,
	catalogueItemId,
	subcontractorId,
	progression,
	entryCount,
});

// Acme holds Sinks in Gardens (u1 at 80, u3 at 40) and Aurora (u5 at 0);
// Beacon holds Wardrobes in Gardens (u1, u4) and Zeta (u6); a Cabinet in u1
// has no Assignment. u2 and u7 hold nothing.
const items: Array<ItemRecord> = [
	item("gardens", "u1", "sink", "acme", 80, 2),
	item("gardens", "u1", "wardrobe", "beacon", 100, 1),
	item("gardens", "u1", "cabinet", null, 0),
	item("gardens", "u3", "sink", "acme", 40, 1),
	item("gardens", "u4", "wardrobe", "beacon", 50, 1),
	item("aurora", "u5", "sink", "acme", 0),
	item("zeta", "u6", "sink", "beacon", 100, 3),
];

interface ItemWhere {
	subcontractorId?: string;
	unit?: { storey: { block: { projectId: string | { in: Array<string> } } } };
}
interface ItemSelect {
	unit?: unknown;
}

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
let idleToken: string;

beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	administratorToken = await sign(key);
	acmeToken = await mint("alex");
	beaconToken = await mint("bo");
	idleToken = await mint("cass");
	const { createApp } = await import("@/app.js");
	app = createApp();
});

afterAll(() => vi.unstubAllGlobals());

beforeEach(() => {
	memberFindUnique.mockReset();
	projectFindMany.mockReset();
	projectFindUnique.mockReset();
	itemFindMany.mockReset();

	memberFindUnique.mockImplementation(
		async ({ where }: { where: { id?: string } }) =>
			members.find((candidate) => candidate.id === where.id) ?? null
	);
	// Items honour the Subcontractor and the Project scope of the query.
	itemFindMany.mockImplementation(
		async ({ where, select }: { where: ItemWhere; select: ItemSelect }) => {
			const scope = where.unit?.storey.block.projectId;
			const projectIds =
				scope === undefined
					? null
					: typeof scope === "string"
						? [scope]
						: scope.in;
			return items
				.filter(
					(row) =>
						(where.subcontractorId === undefined ||
							row.subcontractorId === where.subcontractorId) &&
						(projectIds === null || projectIds.includes(row.projectId))
				)
				.map(({ projectId, entryCount, ...row }) => ({
					...row,
					_count: { entries: entryCount },
					...(select.unit
						? { unit: { storey: { block: { projectId } } } }
						: {}),
				}));
		}
	);
	// Projects honour the id list and come back by name key then id.
	projectFindMany.mockImplementation(
		async ({ where }: { where: { id: { in: Array<string> } } }) =>
			projects
				.filter((project) => where.id.in.includes(project.id))
				.sort(
					(a, b) =>
						a.nameKey.localeCompare(b.nameKey) || a.id.localeCompare(b.id)
				)
				.map(({ id, code, name }) => ({ id, code, name }))
	);
	projectFindUnique.mockImplementation(
		async ({ where }: { where: { id: string } }) => {
			const project = projects.find((candidate) => candidate.id === where.id);
			if (!project) return null;
			const { id, code, name, blocks } = project;
			return { id, code, name, blocks };
		}
	);
});

describe("GET /api/v1/field/projects", () => {
	it("lists only the Projects where the Member's Subcontractor holds Items, by name key, with counts and Progression over its Items alone", async () => {
		const response = await request(app)
			.get("/api/v1/field/projects")
			.set("Authorization", `Bearer ${acmeToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					id: "aurora",
					code: "AUR",
					name: "Aurora",
					itemCount: 1,
					progression: 0,
				},
				{
					id: "gardens",
					code: "EG2",
					name: "Gardens",
					itemCount: 2,
					progression: 60,
				},
			],
		});
		expect(itemFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ subcontractorId: "acme" }),
			})
		);
		expect(projectFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: { id: { in: expect.arrayContaining(["aurora", "gardens"]) } },
			})
		);
		expect(projectFindMany.mock.calls[0]?.[0].where.id.in).not.toContain(
			"zeta"
		);
	});

	it("derives the Subcontractor from the token, never from the request", async () => {
		const response = await request(app)
			.get("/api/v1/field/projects?subcontractorId=acme")
			.set("Authorization", `Bearer ${beaconToken}`)
			.send({ subcontractorId: "acme" });

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: [
				{
					id: "gardens",
					code: "EG2",
					name: "Gardens",
					itemCount: 2,
					progression: 75,
				},
				{
					id: "zeta",
					code: "ZT",
					name: "Zeta",
					itemCount: 1,
					progression: 100,
				},
			],
		});
	});

	it("is an empty list, reading no Projects, when the Subcontractor holds nothing anywhere", async () => {
		const response = await request(app)
			.get("/api/v1/field/projects")
			.set("Authorization", `Bearer ${idleToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ data: [] });
		expect(projectFindMany).not.toHaveBeenCalled();
	});

	it("returns 401 without a Member token", async () => {
		const response = await request(app).get("/api/v1/field/projects");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
		expect(itemFindMany).not.toHaveBeenCalled();
	});

	it("returns 401 for an Administrator's Supabase token", async () => {
		const response = await request(app)
			.get("/api/v1/field/projects")
			.set("Authorization", `Bearer ${administratorToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
	});
});

describe("GET /api/v1/field/projects/:id", () => {
	it("returns the Project's Structure in order with only the nodes holding the Subcontractor's Items, each rolled up over those Items", async () => {
		const response = await request(app)
			.get("/api/v1/field/projects/gardens")
			.set("Authorization", `Bearer ${acmeToken}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({
			data: {
				id: "gardens",
				code: "EG2",
				name: "Gardens",
				itemCount: 2,
				progression: 60,
				blocks: [
					{
						id: "a",
						name: "A",
						itemCount: 2,
						progression: 60,
						storeys: [
							{
								id: "a1",
								name: "01",
								itemCount: 1,
								progression: 80,
								units: [
									{ id: "u1", name: "U1", itemCount: 1, progression: 80 },
								],
							},
							{
								id: "a2",
								name: "02",
								itemCount: 1,
								progression: 40,
								units: [
									{ id: "u3", name: "U3", itemCount: 1, progression: 40 },
								],
							},
						],
					},
				],
			},
		});
		expect(itemFindMany).toHaveBeenCalledWith(
			expect.objectContaining({
				where: expect.objectContaining({ subcontractorId: "acme" }),
			})
		);
	});

	it("shows another Subcontractor's Member the same Project through its own Items", async () => {
		const response = await request(app)
			.get("/api/v1/field/projects/gardens")
			.set("Authorization", `Bearer ${beaconToken}`);

		expect(response.status).toBe(200);
		expect(response.body.data).toMatchObject({
			itemCount: 2,
			progression: 75,
			blocks: [
				{
					id: "a",
					itemCount: 1,
					progression: 100,
					storeys: [{ id: "a1", units: [{ id: "u1", progression: 100 }] }],
				},
				{
					id: "b",
					itemCount: 1,
					progression: 50,
					storeys: [{ id: "b1", units: [{ id: "u4", progression: 50 }] }],
				},
			],
		});
		expect(response.body.data.blocks[0].storeys).toHaveLength(1);
	});

	it("is a 404 for a Project where the Subcontractor holds nothing", async () => {
		const response = await request(app)
			.get("/api/v1/field/projects/zeta")
			.set("Authorization", `Bearer ${acmeToken}`);

		expect(response.status).toBe(404);
		expect(response.body).toEqual({
			error: { code: "NOT_FOUND", message: "Project not found" },
		});
	});

	it("is the same 404 for an unknown Project", async () => {
		const response = await request(app)
			.get("/api/v1/field/projects/nowhere")
			.set("Authorization", `Bearer ${acmeToken}`);

		expect(response.status).toBe(404);
		expect(response.body).toEqual({
			error: { code: "NOT_FOUND", message: "Project not found" },
		});
	});

	it("returns 401 without a Member token", async () => {
		const response = await request(app).get("/api/v1/field/projects/gardens");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
		expect(projectFindUnique).not.toHaveBeenCalled();
	});
});

describe("OpenAPI", () => {
	it("documents both reads under the Field tag with the Member bearer scheme", async () => {
		const response = await request(app).get("/openapi.json");
		const { paths, components } = response.body;

		const list = paths["/api/v1/field/projects"].get;
		expect(list.tags).toEqual(["Field"]);
		expect(list.security).toEqual([{ memberBearerAuth: [] }]);
		expect(Object.keys(list.responses)).toEqual(
			expect.arrayContaining(["200", "401"])
		);

		const read = paths["/api/v1/field/projects/{id}"].get;
		expect(read.tags).toEqual(["Field"]);
		expect(read.security).toEqual([{ memberBearerAuth: [] }]);
		expect(Object.keys(read.responses)).toEqual(
			expect.arrayContaining(["200", "401", "404"])
		);

		expect(components.schemas.FieldProjectRow.properties).toHaveProperty(
			"progression"
		);
		expect(components.schemas.FieldProject.properties.blocks).toBeDefined();
	});
});
