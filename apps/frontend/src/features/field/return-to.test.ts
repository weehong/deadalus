import { describe, expect, it } from "vitest";
import { fieldReturnTo } from "@/features/field/return-to";

describe("fieldReturnTo", () => {
	it("keeps a Field path, with its search", () => {
		expect(fieldReturnTo("/field/units/abc")).toBe("/field/units/abc");
		expect(fieldReturnTo("/field/projects/gardens?block=a&storey=a1")).toBe(
			"/field/projects/gardens?block=a&storey=a1"
		);
	});

	it.each([
		["a full URL", "https://evil.example"],
		["a protocol-relative host", "//evil.example"],
		["a host smuggled behind the Field prefix", "https://evil.example/field/x"],
		["a Console path", "/projects/1"],
		["Sign in itself", "/field/login"],
		["Sign in with a search", "/field/login?redirect=/field/units/abc"],
		["the Field's own index", "/field"],
		["an empty string", ""],
		["something that is not a string", 7],
	])("drops %s", (_label, value) => {
		expect(fieldReturnTo(value)).toBeUndefined();
	});
});
