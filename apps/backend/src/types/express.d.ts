import type { Logger } from "@/config/logger.js";
import type { AuthenticatedUser } from "@/services/auth.service.js";
import type { MemberIdentity } from "@/services/member-auth.service.js";

// `pino-http` attaches a per-request id and child logger to the request object.
// Augment Express's types so handlers can read them without casts.
declare global {
	namespace Express {
		interface Request {
			id: string;
			log: Logger;
			/** Set by `requireAuth` once the bearer token has been verified. */
			user?: AuthenticatedUser;
			/** Set by `requireMember` once the Member token has been verified and the Member loaded. */
			member?: MemberIdentity;
		}
	}
}

export {};
