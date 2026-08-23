import { describe, expect, it } from "vitest";
import { consoleNavigation } from "./navigation";

describe("console navigation", () => {
	it("lists the six destinations in order, with Overview matched exactly", () => {
		expect(consoleNavigation.map((item) => item.path)).toEqual([
			"/",
			"/work-orders",
			"/system-status",
			"/assets",
			"/operators",
			"/settings",
		]);
		expect(consoleNavigation.map((item) => item.exact ?? false)).toEqual([
			true,
			false,
			false,
			false,
			false,
			false,
		]);
	});
});
