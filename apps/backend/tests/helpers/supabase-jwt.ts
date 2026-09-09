import {
	exportJWK,
	generateKeyPair,
	SignJWT,
	type CryptoKey,
	type JWK,
} from "jose";
import { vi } from "vitest";

/**
 * A stand-in for Supabase's signing key. The public half is served from a
 * stubbed `fetch` at the JWKS URL the service derives from `SUPABASE_URL`,
 * so tokens minted with `sign` verify exactly as production tokens would.
 */
export interface SigningKey {
	readonly privateKey: CryptoKey;
	readonly jwk: JWK;
	readonly kid: string;
}

export const SUPABASE_URL = "https://example.supabase.co";
export const ISSUER = `${SUPABASE_URL}/auth/v1`;

export async function createSigningKey(kid = "test-key"): Promise<SigningKey> {
	const { privateKey, publicKey } = await generateKeyPair("ES256");
	const jwk = {
		...(await exportJWK(publicKey)),
		kid,
		alg: "ES256",
		use: "sig",
	};
	return { privateKey, jwk, kid };
}

/** Stub `fetch` so the JWKS URL serves the given key. Anything else 404s. */
export function stubJwks(key: SigningKey): void {
	const jwksUrl = `${SUPABASE_URL}/auth/v1/.well-known/jwks.json`;
	vi.stubGlobal(
		"fetch",
		vi.fn(async (input: Parameters<typeof fetch>[0]) => {
			const url = typeof input === "string" ? input : input.toString();
			const body =
				url === jwksUrl ? { keys: [key.jwk] } : { error: "not found" };
			return new Response(JSON.stringify(body), {
				status: url === jwksUrl ? 200 : 404,
				headers: { "content-type": "application/json" },
			});
		})
	);
}

interface SignOptions {
	readonly subject?: string;
	readonly email?: string;
	readonly issuer?: string;
	readonly audience?: string;
	readonly expiresIn?: string;
}

/** Mint an access token shaped like the ones Supabase Auth issues. */
export async function sign(
	key: SigningKey,
	options: SignOptions = {}
): Promise<string> {
	const {
		subject = "00000000-0000-4000-8000-000000000001",
		email = "administrator@example.com",
		issuer = ISSUER,
		audience = "authenticated",
		expiresIn = "1h",
	} = options;

	return new SignJWT({ email, role: "authenticated" })
		.setProtectedHeader({ alg: "ES256", kid: key.kid })
		.setSubject(subject)
		.setIssuer(issuer)
		.setAudience(audience)
		.setIssuedAt()
		.setExpirationTime(expiresIn)
		.sign(key.privateKey);
}
