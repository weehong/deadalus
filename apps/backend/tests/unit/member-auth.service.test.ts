import { decodeJwt, SignJWT } from "jose";
import { describe, expect, it, vi } from "vitest";

import { HttpError } from "@/lib/http-error.js";
import {
	MEMBER_SESSION_LIFETIME_SECONDS,
	signMemberToken,
	verifyMemberToken,
} from "@/services/member-auth.service.js";
import { createSigningKey, sign } from "../helpers/supabase-jwt.js";

// The service loads Members through the Prisma singleton; the token pair
// under test never touches it, so the client is replaced with an empty stub.
vi.mock("@/lib/prisma.js", () => ({ prisma: {} }));

const secret = new TextEncoder().encode(process.env["MEMBER_TOKEN_SECRET"]);

interface MintOptions {
	readonly subject?: string;
	readonly issuer?: string;
	readonly audience?: string;
	readonly expiresIn?: string;
	readonly key?: Uint8Array;
}

/** Mint a Member-shaped token with any claim bent out of shape. */
async function mint(options: MintOptions = {}): Promise<string> {
	const {
		subject = "member-1",
		issuer = "daedalus",
		audience = "field",
		expiresIn = "30d",
		key = secret,
	} = options;
	const jwt = new SignJWT({})
		.setProtectedHeader({ alg: "HS256" })
		.setIssuer(issuer)
		.setAudience(audience)
		.setIssuedAt()
		.setExpirationTime(expiresIn);
	if (subject) jwt.setSubject(subject);
	return jwt.sign(key);
}

async function expectUnauthorized(token: string): Promise<void> {
	const failure = await verifyMemberToken(token).catch(
		(error: unknown) => error
	);
	expect(failure).toBeInstanceOf(HttpError);
	expect((failure as HttpError).statusCode).toBe(401);
	expect((failure as HttpError).code).toBe("UNAUTHORIZED");
}

describe("signMemberToken and verifyMemberToken", () => {
	it("round-trips the Member id as the subject", async () => {
		const token = await signMemberToken("member-42");
		await expect(verifyMemberToken(token)).resolves.toBe("member-42");
	});

	it("names Daedalus as issuer, the Field as audience and expires in thirty days", async () => {
		const before = Math.floor(Date.now() / 1000);
		const payload = decodeJwt(await signMemberToken("member-42"));
		expect(payload.iss).toBe("daedalus");
		expect(payload.aud).toBe("field");
		expect(payload.sub).toBe("member-42");
		expect(MEMBER_SESSION_LIFETIME_SECONDS).toBe(30 * 24 * 60 * 60);
		expect(payload.exp).toBeGreaterThanOrEqual(
			before + MEMBER_SESSION_LIFETIME_SECONDS
		);
		expect(payload.exp).toBeLessThanOrEqual(
			before + MEMBER_SESSION_LIFETIME_SECONDS + 5
		);
	});

	it("rejects an expired token", async () => {
		await expectUnauthorized(await mint({ expiresIn: "-1m" }));
	});

	it("rejects a token for another audience", async () => {
		await expectUnauthorized(await mint({ audience: "authenticated" }));
	});

	it("rejects a token from another issuer", async () => {
		await expectUnauthorized(
			await mint({ issuer: "https://example.supabase.co/auth/v1" })
		);
	});

	it("rejects a token signed with a different secret", async () => {
		await expectUnauthorized(
			await mint({
				key: new TextEncoder().encode("another-secret-of-at-least-32-chars!"),
			})
		);
	});

	it("rejects a token with no subject", async () => {
		await expectUnauthorized(await mint({ subject: "" }));
	});

	it("rejects a Supabase-signed token even with the Field claims", async () => {
		const key = await createSigningKey();
		await expectUnauthorized(
			await sign(key, { issuer: "daedalus", audience: "field" })
		);
	});

	it("rejects something that is not a token at all", async () => {
		await expectUnauthorized("not-a-token");
	});
});
