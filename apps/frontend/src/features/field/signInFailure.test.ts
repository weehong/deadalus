import { describe, expect, it } from "vitest";
import { ApiRequestError } from "@/common/api";
import { mapSignInError } from "@/features/field/signInFailure";

describe("mapSignInError", () => {
	it.each([
		["a network TypeError", new TypeError("Failed to fetch"), "Unavailable"],
		[
			"an unregistered phone",
			new ApiRequestError(404, "Not registered", "MEMBER_NOT_FOUND"),
			"NotRegistered",
		],
		[
			"a 404 of another kind",
			new ApiRequestError(404, "Cannot POST", "NOT_FOUND"),
			"Unknown",
		],
		[
			"rate limiting",
			new ApiRequestError(429, "Too many requests"),
			"RateLimited",
		],
		["a server error", new ApiRequestError(503, "Unavailable"), "Unavailable"],
		["a validation error", new ApiRequestError(400, "Bad"), "Unknown"],
		["something else", new Error("?"), "Unknown"],
	])("maps %s", (_label, error, expected) => {
		expect(mapSignInError(error)).toBe(expected);
	});
});
