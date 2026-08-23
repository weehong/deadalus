import { describe, expect, it } from "vitest";
import { installationSchema } from "./installationSchema";

describe("installationSchema", () => {
	it("requires equipment and asset tag", () => {
		expect(
			installationSchema.safeParse({
				equipment: "",
				model: "",
				assetTag: "",
				location: "",
				installedDate: "",
				state: "scheduled",
			}).success
		).toBe(false);
	});
	it("accepts a complete installation", () => {
		expect(
			installationSchema.safeParse({
				equipment: "AHU",
				model: "X2",
				assetTag: "M-1",
				location: "Roof",
				installedDate: "2026-01-01",
				state: "live",
			}).success
		).toBe(true);
	});
});
