import { afterAll, beforeAll, describe, expect, it, vi } from "vitest";

import { HttpError } from "@/lib/http-error.js";
import { verifyAccessToken } from "@/services/auth.service.js";
import {
	createSigningKey,
	sign,
	stubJwks,
	type SigningKey,
} from "../helpers/supabase-jwt.js";

// The service builds its remote JWKS once per module and caches the keys it
// fetches, so one signing key serves the whole file.
let key: SigningKey;

beforeAll(async () => {
	key = await createSigningKey();
	stubJwks(key);
});

afterAll(() => {
	vi.unstubAllGlobals();
});

async function expectUnauthorized(token: string): Promise<void> {
	const failure = await verifyAccessToken(token).catch(
		(error: unknown) => error
	);
	expect(failure).toBeInstanceOf(HttpError);
	expect((failure as HttpError).statusCode).toBe(401);
	expect((failure as HttpError).code).toBe("UNAUTHORIZED");
}

describe("verifyAccessToken", () => {
	it("returns the subject and email of a valid token", async () => {
		const token = await sign(key, {
			subject: "00000000-0000-4000-8000-0000000000aa",
			email: "someone@example.com",
		});

		await expect(verifyAccessToken(token)).resolves.toEqual({
			id: "00000000-0000-4000-8000-0000000000aa",
			email: "someone@example.com",
		});
	});

	it("rejects a token from another issuer", async () => {
		await expectUnauthorized(
			await sign(key, { issuer: "https://other.supabase.co/auth/v1" })
		);
	});

	it("rejects a token for another audience", async () => {
		await expectUnauthorized(await sign(key, { audience: "anon" }));
	});

	it("rejects an expired token", async () => {
		await expectUnauthorized(await sign(key, { expiresIn: "-1m" }));
	});

	it("rejects a token signed by a different key", async () => {
		const impostor = await createSigningKey(key.kid);
		await expectUnauthorized(await sign(impostor));
	});
});
