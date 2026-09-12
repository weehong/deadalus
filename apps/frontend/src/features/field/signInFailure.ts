import { ApiRequestError } from "@/common/api";

/** The closed set of ways a Field sign-in can fail, each with its own copy. */
export type FieldSignInFailure =
	"NotRegistered" | "RateLimited" | "Unavailable" | "Unknown";

/**
 * Collapse a failed sign-in into the closed set. An unregistered number is
 * named plainly: with the phone as the whole credential there is nothing to
 * hide by being vague.
 */
export const mapSignInError = (error: unknown): FieldSignInFailure => {
	if (error instanceof TypeError) return "Unavailable";
	if (!(error instanceof ApiRequestError)) return "Unknown";
	if (error.status === 404 && error.code === "MEMBER_NOT_FOUND")
		return "NotRegistered";
	if (error.status === 429) return "RateLimited";
	if (error.status >= 500) return "Unavailable";
	return "Unknown";
};
