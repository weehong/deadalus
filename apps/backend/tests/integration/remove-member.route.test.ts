import request from "supertest";
import { afterAll, beforeAll, beforeEach, expect, it, vi } from "vitest";
import { createSigningKey, sign, stubJwks } from "../helpers/supabase-jwt.js";
const findFirst = vi.fn();
const count = vi.fn();
const deleteMember = vi.fn();
const transaction = vi.fn();
const findUnique = vi.fn();
vi.mock("@/lib/prisma.js", () => ({
	prisma: { $transaction: transaction, subcontractor: { findUnique } },
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
beforeEach(() => {
	vi.clearAllMocks();
	transaction.mockReset();
	findFirst.mockResolvedValue({ id: "alex" });
	count.mockResolvedValue(2);
	deleteMember.mockResolvedValue({ id: "alex" });
	transaction.mockImplementation(
		async (action: (tx: unknown) => Promise<void>) =>
			action({ member: { findFirst, count, delete: deleteMember } })
	);
});
afterAll(() => vi.unstubAllGlobals());
it("removes a Member with an empty 204 response", async () => {
	const response = await request(app)
		.delete("/api/v1/subcontractors/acme/members/alex")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(204);
	expect(response.text).toBe("");
});

it.each(["missing/members/alex", "other/members/alex", "acme/members/missing"])(
	"returns 404 for a Member outside the requested Subcontractor (%s)",
	async (path) => {
		findFirst.mockImplementation(
			async ({ where }: { where: { id: string; subcontractorId: string } }) =>
				where.id === "alex" && where.subcontractorId === "acme"
					? { id: "alex" }
					: null
		);
		const response = await request(app)
			.delete(`/api/v1/subcontractors/${path}`)
			.set("Authorization", `Bearer ${token}`);
		expect(response.status).toBe(404);
		expect(response.body.error.code).toBe("NOT_FOUND");
	}
);

it("refuses the last Member with a useful conflict", async () => {
	count.mockResolvedValue(1);
	const response = await request(app)
		.delete("/api/v1/subcontractors/acme/members/alex")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(409);
	expect(response.body.error).toMatchObject({
		code: "LAST_MEMBER",
		message: "A Subcontractor must keep at least one Member.",
	});
});

it("rechecks the invariant after a concurrent removal wins a serialization conflict", async () => {
	transaction.mockRejectedValueOnce({ code: "P2034" });
	count.mockResolvedValue(1);
	const response = await request(app)
		.delete("/api/v1/subcontractors/acme/members/alex")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(409);
	expect(response.body.error.code).toBe("LAST_MEMBER");
});

it("stops after repeated serialization conflicts", async () => {
	transaction
		.mockRejectedValueOnce({ code: "P2034" })
		.mockRejectedValueOnce({ code: "P2034" })
		.mockRejectedValueOnce({ code: "P2034" });
	const response = await request(app)
		.delete("/api/v1/subcontractors/acme/members/alex")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(500);
	expect(response.body.error.code).toBe("INTERNAL_SERVER_ERROR");
});
it.each([undefined, "invalid-token"])(
	"requires a verified Session (%s)",
	async (bearer) => {
		const call = request(app).delete(
			"/api/v1/subcontractors/acme/members/alex"
		);
		if (bearer) call.set("Authorization", `Bearer ${bearer}`);
		const response = await call;
		expect(response.status).toBe(401);
		expect(response.body.error.code).toBe("UNAUTHORIZED");
	}
);
it("documents the guarded removal and its outcomes", async () => {
	const response = await request(app).get("/openapi.json");
	const operation =
		response.body.paths["/api/v1/subcontractors/{id}/members/{memberId}"]
			?.delete;
	expect(operation).toBeDefined();
	expect(operation.security).toEqual([{ bearerAuth: [] }]);
	expect(Object.keys(operation.responses)).toEqual(
		expect.arrayContaining(["204", "401", "404", "409"])
	);
});

it("concurrent removals leave one Member retrievable over HTTP", async () => {
	let remaining = [
		{ id: "alex", name: "Alex", phone: "+6591111111" },
		{ id: "mei", name: "Mei", phone: "+6592222222" },
	];
	let version = 0;
	let readers = 0;
	let releaseReaders: () => void = () => undefined;
	const bothRead = new Promise<void>((resolve) => {
		releaseReaders = resolve;
	});
	findUnique.mockImplementation(async () => ({
		id: "acme",
		name: "Acme Fitout",
		members: remaining,
	}));
	// The database boundary models snapshots and serialization conflicts, while
	// both clients drive the real route, service and error middleware.
	transaction.mockImplementation(
		async (
			action: (tx: unknown) => Promise<void>,
			options?: { isolationLevel?: string }
		) => {
			const snapshotVersion = version;
			const snapshot = [...remaining];
			let removedId: string | undefined;
			await action({
				member: {
					findFirst: async ({ where }: { where: { id: string } }) =>
						snapshot.find((member) => member.id === where.id) ?? null,
					count: async () => {
						readers += 1;
						if (readers === 2) releaseReaders();
						await bothRead;
						return snapshot.length;
					},
					delete: async ({ where }: { where: { id: string } }) => {
						removedId = where.id;
					},
				},
			});
			if (
				options?.isolationLevel === "Serializable" &&
				snapshotVersion !== version
			)
				throw { code: "P2034" };
			remaining = remaining.filter((member) => member.id !== removedId);
			version += 1;
		}
	);
	const responses = await Promise.all(
		["alex", "mei"].map((memberId) =>
			request(app)
				.delete(`/api/v1/subcontractors/acme/members/${memberId}`)
				.set("Authorization", `Bearer ${token}`)
		)
	);
	expect(responses.map((response) => response.status).sort()).toEqual([
		204, 409,
	]);
	const response = await request(app)
		.get("/api/v1/subcontractors/acme")
		.set("Authorization", `Bearer ${token}`);
	expect(response.status).toBe(200);
	expect(response.body.data.members).toHaveLength(1);
});
