import { describe, expect, it } from "vitest";
import { fieldUnitUrl } from "@/features/field/field-unit-url";

describe("fieldUnitUrl", () => {
	it("addresses the Unit's Field screen on the given origin", () => {
		expect(fieldUnitUrl("https://console.example.com", "cm5unit01")).toBe(
			"https://console.example.com/field/units/cm5unit01"
		);
	});

	it("keeps a development origin with its port, so a label says where it came from", () => {
		expect(fieldUnitUrl("http://localhost:5173", "unit-a2-01")).toBe(
			"http://localhost:5173/field/units/unit-a2-01"
		);
	});
});
