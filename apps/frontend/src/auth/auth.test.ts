import { describe, expect, it } from "vitest";
import { mapAuthError } from "./auth";

describe("mapAuthError", () => {
	it.each([
		["a network TypeError", new TypeError("Failed to fetch"), "Unavailable"],
		["status 0", { status: 0 }, "Unavailable"],
		[
			"a wrong password",
			{ status: 400, message: "Invalid login credentials" },
			"InvalidCredentials",
		],
		[
			"an unconfirmed email",
			{ status: 400, message: "Email not confirmed" },
			"InvalidCredentials",
		],
		["an unknown account", { status: 401 }, "InvalidCredentials"],
		["rate limiting", { status: 429 }, "RateLimited"],
		["a server error", { status: 503 }, "Unavailable"],
		["no status at all", { message: "?" }, "Unknown"],
		["undefined", undefined, "Unknown"],
	])("maps %s", (_label, error, expected) => {
		expect(mapAuthError(error)).toBe(expected);
	});
});
