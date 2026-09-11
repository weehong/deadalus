import { describe, expect, it } from "vitest";
import { normalizePhone } from "@/lib/normalize-phone.js";

describe("Member phone normalization", () => {
	it.each([
		["9123 4567", "+6591234567"],
		[" +65 (9123)-4567. ", "+6591234567"],
		["0065 9123 4567", "+6591234567"],
		["+44 20 7946 0958", "+442079460958"],
		["0044 20 7946 0958", "+442079460958"],
		["123456", "+65123456"],
		["+123456789012345", "+123456789012345"],
	])("normalizes %s to its stored form", (input, expected) => {
		expect(normalizePhone(input)).toBe(expected);
	});
	it.each([
		"",
		"  ",
		"12345",
		"abc91234567",
		"+012345678",
		"+1234567",
		"+1234567890123456",
		"12345678901234",
		"++6591234567",
		"9123/4567",
		"91234567 ext 1",
	])("rejects impossible input %s", (input) => {
		expect(normalizePhone(input)).toBeNull();
	});
});
