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

export const normalizeDetectedLanguage = (
	language: string
): "en-US" | "zh-CN" => {
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
	// Detection normalizes bare and regional variants to the two bundled regional locales.
	// Base tags are matching aliases only; resources remain regional below.
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

const syncDocumentLanguage = (language: string): void => {
	document.documentElement.lang = language === "zh-CN" ? "zh-CN" : "en-US";
};
syncDocumentLanguage(i18n.resolvedLanguage ?? "en-US");
i18n.on("languageChanged", syncDocumentLanguage);

export default i18n;
