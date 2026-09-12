import { describe, expect, it } from "vitest";
import { nameKey, unitTypeCodeKey } from "@/lib/name-key.js";
describe("identity keys", () => {
	it("collapses name whitespace and case while preserving punctuation", () => {
		expect(nameKey("  Acme\t Fitout  ")).toBe("acme fitout");
		expect(nameKey(" A-03-04 ")).toBe("a-03-04");
	});
	it("removes all code whitespace and retains developer qualifiers", () => {
		expect(unitTypeCodeKey(" bp2(p) \t(M)\n")).toBe("BP2(P)(M)");
		expect(unitTypeCodeKey(" C1 (d) ")).toBe("C1(D)");
		expect(unitTypeCodeKey("bp2\u00a0(p)\u2003(M)\r\n")).toBe("BP2(P)(M)");
		expect(unitTypeCodeKey("3D1a-PH")).toBe("3D1A-PH");
		expect(unitTypeCodeKey("PH")).toBe("PH");
	});
});
