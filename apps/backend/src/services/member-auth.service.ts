import { jwtVerify, SignJWT } from "jose";

import { env } from "@/config/env.js";
import { HttpError } from "@/lib/http-error.js";
import { normalizePhone } from "@/lib/normalize-phone.js";
import { prisma } from "@/lib/prisma.js";

/** The Member behind a Field Session, with the Subcontractor it belongs to. */
export interface MemberIdentity {
	readonly id: string;
	readonly name: string;
	readonly subcontractor: { readonly id: string; readonly name: string };
}

/** What a successful phone sign-in hands back. */
export interface MemberSession {
	readonly token: string;
	readonly member: MemberIdentity;
}

const MEMBER_TOKEN_ISSUER = "daedalus";
const MEMBER_TOKEN_AUDIENCE = "field";
/** A Member's Session lasts thirty days. */
export const MEMBER_SESSION_LIFETIME_SECONDS = 30 * 24 * 60 * 60;

// HS256 with the backend's own secret: the sanctioned exception to ADR-0001
// that ADR-0009 records. The algorithm is pinned on both sides so a Supabase
// (ES256) token can never verify here, whatever claims it carries.
const secret = new TextEncoder().encode(env.MEMBER_TOKEN_SECRET);

/** Sign a Member token whose subject is the Member id. */
export async function signMemberToken(memberId: string): Promise<string> {
	return new SignJWT({})
		.setProtectedHeader({ alg: "HS256" })
		.setSubject(memberId)
		.setIssuer(MEMBER_TOKEN_ISSUER)
		.setAudience(MEMBER_TOKEN_AUDIENCE)
		.setIssuedAt()
		.setExpirationTime(`${String(MEMBER_SESSION_LIFETIME_SECONDS)}s`)
		.sign(secret);
}

/** Verify a Member token and return the Member id it names. */
export async function verifyMemberToken(token: string): Promise<string> {
	try {
		const { payload } = await jwtVerify(token, secret, {
			issuer: MEMBER_TOKEN_ISSUER,
			audience: MEMBER_TOKEN_AUDIENCE,
			algorithms: ["HS256"],
		});

		if (typeof payload.sub !== "string" || payload.sub.length === 0) {
			throw new Error("Token has no subject");
		}

		return payload.sub;
	} catch (error) {
		throw new HttpError(401, "Invalid or expired Member token", {
			code: "UNAUTHORIZED",
			cause: error,
		});
	}
}

const memberSelect = {
	id: true,
	name: true,
	subcontractor: { select: { id: true, name: true } },
} as const;

/**
 * Load a Member with its Subcontractor, or null once the Member has been
 * removed from the Directory. Called on every Field request so a removed
 * Member's Session lapses immediately (ADR-0009).
 */
export async function loadMember(id: string): Promise<MemberIdentity | null> {
	return prisma.member.findUnique({ where: { id }, select: memberSelect });
}

/**
 * Sign in with a phone number alone. The number is normalised the way the
 * Directory stores it; a number that cannot be one, or that no Member holds,
 * is "not registered" — with the phone as the whole credential there is
 * nothing to hide by being vague.
 */
export async function signInWithPhone(phone: string): Promise<MemberSession> {
	const notRegistered = new HttpError(
		404,
		"That phone number is not registered",
		{ code: "MEMBER_NOT_FOUND" }
	);
	const normalized = normalizePhone(phone);
	if (normalized === null) throw notRegistered;

	const member = await prisma.member.findUnique({
		where: { phone: normalized },
		select: memberSelect,
	});
	if (!member) throw notRegistered;

	return { token: await signMemberToken(member.id), member };
}
