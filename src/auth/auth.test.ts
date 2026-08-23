import { describe, expect, it } from "vitest";
import { mapAuthError } from "./auth";

describe("mapAuthError", () => {
	it.each([
		[{ status: 400, message: "invalid credentials" }, "InvalidCredentials"],
		[{ status: 422, message: "email not confirmed" }, "InvalidCredentials"],
		[{ status: 429 }, "RateLimited"],
		[{ status: 503 }, "Unavailable"],
		[new TypeError("fetch failed"), "Unavailable"],
		[{ status: 0, message: "Failed to fetch" }, "Unavailable"],
		[{ status: 301 }, "Unknown"],
	] as const)("maps provider failures", (error, expected) => {
		expect(mapAuthError(error)).toBe(expected);
	});
});
