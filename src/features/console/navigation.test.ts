import { describe, expect, it } from "vitest";
import { consoleNavigation } from "./navigation";

describe("console navigation", () => {
	it("keeps the six original destinations in order and adds Blueprints", () => {
		expect(consoleNavigation.slice(0, 6).map((item) => item.path)).toEqual([
			"/",
			"/work-orders",
			"/system-status",
			"/assets",
			"/operators",
			"/settings",
		]);
		expect(
			consoleNavigation.slice(0, 6).map((item) => item.exact ?? false)
		).toEqual([true, false, false, false, false, false]);
		expect(consoleNavigation[6]?.children?.map((item) => item.path)).toEqual([
			"/blueprints/upload",
			"/blueprints/structure",
			"/blueprints/units",
			"/blueprints/subcontractors",
		]);
	});
});
