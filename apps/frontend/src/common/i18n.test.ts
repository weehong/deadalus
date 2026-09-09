import { describe, expect, it } from "vitest";
import { normalizeDetectedLanguage } from "./i18n";

describe("normalizeDetectedLanguage", () => {
	it.each([
		["en", "en-US"],
		["en-GB", "en-US"],
		["fr", "en-US"],
		["zh", "zh-CN"],
		["zh-CN", "zh-CN"],
		["zh-Hans", "zh-CN"],
		["zh-SG", "zh-CN"],
		["zh-TW", "en-US"],
		["zh-HK", "en-US"],
		["zh-Hant", "en-US"],
	])("maps %s to %s", (detected, expected) => {
		expect(normalizeDetectedLanguage(detected)).toBe(expected);
	});
});
