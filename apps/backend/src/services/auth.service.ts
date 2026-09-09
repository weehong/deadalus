import { createRemoteJWKSet, jwtVerify } from "jose";

import { env } from "@/config/env.js";
import { HttpError } from "@/lib/http-error.js";

/** The identity carried by a verified Supabase access token. */
export interface AuthenticatedUser {
	readonly id: string;
	readonly email?: string;
}

/**
 * Supabase signs access tokens with the project's current signing key and
 * publishes the public half as a JWKS. `createRemoteJWKSet` fetches it lazily,
 * caches it, and refetches on an unknown `kid`, so key rotation needs no
 * restart and no secret ever enters this service.
 */
const jwks = createRemoteJWKSet(
	new URL("/auth/v1/.well-known/jwks.json", env.SUPABASE_URL)
);

const issuer = `${env.SUPABASE_URL}/auth/v1`;

/**
 * Verify a Supabase access token and return the identity it carries.
 *
 * The algorithm is pinned to ES256 — what Supabase's asymmetric signing keys
 * use — so a token signed with anything else (including a legacy HS256 secret
 * that happens to be present in the JWKS) is rejected outright.
 */
export async function verifyAccessToken(
	token: string
): Promise<AuthenticatedUser> {
	try {
		const { payload } = await jwtVerify(token, jwks, {
			issuer,
			audience: "authenticated",
			algorithms: ["ES256"],
		});

		if (typeof payload.sub !== "string" || payload.sub.length === 0) {
			throw new Error("Token has no subject");
		}

		return {
			id: payload.sub,
			...(typeof payload["email"] === "string"
				? { email: payload["email"] }
				: {}),
		};
	} catch (error) {
		throw new HttpError(401, "Invalid or expired access token", {
			code: "UNAUTHORIZED",
			cause: error,
		});
	}
}
