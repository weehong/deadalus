import i18n, { type InitOptions } from "i18next";
import LanguageDetector from "i18next-browser-languagedetector";
import Backend, { type HttpBackendOptions } from "i18next-http-backend";
import { initReactI18next } from "react-i18next";
import translationEN from "@/assets/locales/en-US/translations.json";
import translationZH from "@/assets/locales/zh-CN/translations.json";
import { isProduction } from "@/common/utils";

export const defaultNS = "translations";
export const resources = {
	"en-US": { translations: translationEN },
	"zh-CN": { translations: translationZH },
} as const;

export type SupportedLanguage = keyof typeof resources;
export const supportedLanguages: Array<SupportedLanguage> = ["en-US", "zh-CN"];

/**
 * Collapse whatever the browser reports onto the two bundled locales. Any
 * Simplified-Chinese variant becomes zh-CN; Traditional variants (TW, HK, MO,
 * Hant) deliberately fall back to English rather than being served the wrong
 * script.
 */
export const normalizeDetectedLanguage = (
	language: string
): SupportedLanguage => {
	if (
		/^zh(?:-|$)/i.test(language) &&
		!/^zh-(?:TW|HK|MO|Hant)(?:-|$)/i.test(language)
	) {
		return "zh-CN";
	}
	return "en-US";
};

const i18nOptions: InitOptions<HttpBackendOptions> = {
	defaultNS,
	ns: [defaultNS],
	resources,
	debug: !isProduction,
	initAsync: false,
	fallbackLng: "en-US",
	// Base tags are matching aliases only; resources remain regional.
	supportedLngs: ["en", "en-US", "zh", "zh-CN"],
	nonExplicitSupportedLngs: true,
	load: "currentOnly",
	detection: {
		order: ["localStorage", "navigator"],
		caches: ["localStorage"],
		convertDetectedLanguage: normalizeDetectedLanguage,
	},
	interpolation: {
		escapeValue: false, // not needed for react as it escapes by default
	},
	backend: {
		loadPath: isProduction
			? "locales/{{lng}}/translations.json"
			: "src/assets/locales/{{lng}}/translations.json",
	},
};

void i18n
	.use(initReactI18next)
	.use(LanguageDetector)
	.use(Backend)
	.init<HttpBackendOptions>(i18nOptions);

/** Keep the document's declared language in step with what is displayed. */
const syncDocumentLanguage = (language: string): void => {
	document.documentElement.lang = normalizeDetectedLanguage(language);
};
syncDocumentLanguage(i18n.resolvedLanguage ?? "en-US");
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;
