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

interface MemberRecord {
	id: string;
	name: string;
	phone: string;
	subcontractor: { id: string; name: string };
}

let members: Array<MemberRecord>;
const findUnique = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: { member: { findUnique } },
}));

let app: import("express").Application;
let administratorToken: string;

const secret = new TextEncoder().encode(process.env["MEMBER_TOKEN_SECRET"]);

/** Mint a Member token with a claim bent out of shape. */
async function mint(options: {
	subject?: string;
	audience?: string;
	expiresIn?: string;
}): Promise<string> {
	return new SignJWT({})
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(options.subject ?? "alex")
		.setIssuer("daedalus")
		.setAudience(options.audience ?? "field")
		.setIssuedAt()
		.setExpirationTime(options.expiresIn ?? "30d")
		.sign(secret);
}

beforeAll(async () => {
	const key = await createSigningKey();
	stubJwks(key);
	administratorToken = await sign(key);
	const { createApp } = await import("@/app.js");
	app = createApp();
});

afterAll(() => vi.unstubAllGlobals());

beforeEach(() => {
	findUnique.mockReset();
	members = [
		{
			id: "alex",
			name: "Alex Tan",
			phone: "+6591234567",
			subcontractor: { id: "acme", name: "Acme Joinery" },
		},
	];
	// Honour the `select` the service sends: the phone never leaves the row.
	findUnique.mockImplementation(
		async ({ where }: { where: { id?: string; phone?: string } }) => {
			const member = members.find(
				(candidate) =>
					(where.id !== undefined && candidate.id === where.id) ||
					(where.phone !== undefined && candidate.phone === where.phone)
			);
			return member
				? {
						id: member.id,
						name: member.name,
						subcontractor: member.subcontractor,
					}
				: null;
		}
	);
});

const memberShape = {
	id: "alex",
	name: "Alex Tan",
	subcontractor: { id: "acme", name: "Acme Joinery" },
};

describe("POST /api/v1/field/sessions", () => {
	it.each(["9123 4567", "+65 9123-4567", "0065 9123 4567", "+6591234567"])(
		"signs in a known phone written as %s",
		async (phone) => {
			const response = await request(app)
				.post("/api/v1/field/sessions")
				.send({ phone });

			expect(response.status).toBe(200);
			expect(response.body).toEqual({
				data: { token: expect.any(String), member: memberShape },
			});
			expect(findUnique).toHaveBeenCalledWith(
				expect.objectContaining({ where: { phone: "+6591234567" } })
			);

			const me = await request(app)
				.get("/api/v1/field/me")
				.set("Authorization", `Bearer ${response.body.data.token}`);
			expect(me.status).toBe(200);
			expect(me.body).toEqual({ data: memberShape });
		}
	);

	it("returns 404 MEMBER_NOT_FOUND for an unregistered phone", async () => {
		const response = await request(app)
			.post("/api/v1/field/sessions")
			.send({ phone: "9876 5432" });

		expect(response.status).toBe(404);
		expect(response.body).toMatchObject({
			error: {
				code: "MEMBER_NOT_FOUND",
				message: "That phone number is not registered",
			},
		});
	});

	it("returns 404 MEMBER_NOT_FOUND for a phone that cannot be a number", async () => {
		const response = await request(app)
			.post("/api/v1/field/sessions")
			.send({ phone: "not a phone" });

		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("MEMBER_NOT_FOUND");
		expect(findUnique).not.toHaveBeenCalled();
	});

	it.each([{ phone: "" }, { phone: "   " }, {}])(
		"returns 400 for a blank phone (%j)",
		async (body) => {
			const response = await request(app)
				.post("/api/v1/field/sessions")
				.send(body);

			expect(response.status).toBe(400);
			expect(response.body.error.code).toBe("BAD_REQUEST");
			expect(findUnique).not.toHaveBeenCalled();
		}
	);
});

describe("GET /api/v1/field/me", () => {
	it("returns the member shape for a Member token", async () => {
		const response = await request(app)
			.get("/api/v1/field/me")
			.set("Authorization", `Bearer ${await mint({})}`);

		expect(response.status).toBe(200);
		expect(response.body).toEqual({ data: memberShape });
		expect(findUnique).toHaveBeenCalledWith(
			expect.objectContaining({ where: { id: "alex" } })
		);
	});

	it("returns 401 without a bearer token", async () => {
		const response = await request(app).get("/api/v1/field/me");

		expect(response.status).toBe(401);
		expect(response.body).toMatchObject({
			error: { code: "UNAUTHORIZED", message: "Missing bearer token" },
		});
	});

	it("returns 401 for a token that does not verify", async () => {
		const response = await request(app)
			.get("/api/v1/field/me")
			.set("Authorization", "Bearer not-a-real-token");

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
	});

	it("returns 401 for an expired token", async () => {
		const response = await request(app)
			.get("/api/v1/field/me")
			.set("Authorization", `Bearer ${await mint({ expiresIn: "-1m" })}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
	});

	it("returns 401 for a token with the wrong audience", async () => {
		const response = await request(app)
			.get("/api/v1/field/me")
			.set(
				"Authorization",
				`Bearer ${await mint({ audience: "authenticated" })}`
			);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
	});

	it("returns 401 for a Supabase-signed Administrator token", async () => {
		const response = await request(app)
			.get("/api/v1/field/me")
			.set("Authorization", `Bearer ${administratorToken}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
		expect(findUnique).not.toHaveBeenCalled();
	});

	it("returns 401 once the Member has been removed from the Directory", async () => {
		const token = await mint({});
		members = [];

		const response = await request(app)
			.get("/api/v1/field/me")
			.set("Authorization", `Bearer ${token}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
	});
});

describe("the two token kinds never verify each other", () => {
	it("refuses a Member token on a Console route", async () => {
		const response = await request(app)
			.get("/api/v1/me")
			.set("Authorization", `Bearer ${await mint({})}`);

		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
	});

	it("still accepts the Administrator token on the Console route", async () => {
		const response = await request(app)
			.get("/api/v1/me")
			.set("Authorization", `Bearer ${administratorToken}`);

		expect(response.status).toBe(200);
	});
});

describe("OpenAPI", () => {
	it("documents both Field routes under the Field tag with the Member bearer scheme", async () => {
		const response = await request(app).get("/openapi.json");
		const { paths, components } = response.body;

		expect(paths["/api/v1/field/sessions"].post.tags).toEqual(["Field"]);
		expect(paths["/api/v1/field/sessions"].post.security).toBeUndefined();
		expect(paths["/api/v1/field/me"].get.tags).toEqual(["Field"]);
		expect(paths["/api/v1/field/me"].get.security).toEqual([
			{ memberBearerAuth: [] },
		]);
		expect(components.securitySchemes.memberBearerAuth).toMatchObject({
			type: "http",
			scheme: "bearer",
		});
		expect(paths["/api/v1/me"].get.security).toEqual([{ bearerAuth: [] }]);
	});
});
