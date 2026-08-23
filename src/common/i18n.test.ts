import { afterEach, describe, expect, it } from "vitest";
import i18n, { normalizeDetectedLanguage, resources } from "./i18n";

afterEach(async () => {
	await i18n.changeLanguage("en-US");
});

describe("locale resolution", () => {
	it.each(["en", "en-GB", "en-US", "fr-FR"])(
		"resolves %s to regional English",
		(language) => {
			expect(normalizeDetectedLanguage(language)).toBe("en-US");
		}
	);

	it.each(["zh", "zh-CN", "zh-Hans", "zh-SG"])(
		"resolves %s to Simplified Chinese",
		(language) => {
			expect(normalizeDetectedLanguage(language)).toBe("zh-CN");
		}
	);

	it.each(["zh-TW", "zh-HK", "zh-MO", "zh-Hant", "zh-Hant-TW"])(
		"does not serve Simplified Chinese to %s",
		(language) => {
			expect(normalizeDetectedLanguage(language)).toBe("en-US");
		}
	);

	it("bundles only the declared regional locales", () => {
		expect(Object.keys(resources)).toEqual(["en-US", "zh-CN"]);
	});

	it("keeps the document language synchronized with the active locale", async () => {
		await i18n.changeLanguage("zh-CN");
		expect(document.documentElement.lang).toBe("zh-CN");

		await i18n.changeLanguage("en-US");
		expect(document.documentElement.lang).toBe("en-US");
	});
});
