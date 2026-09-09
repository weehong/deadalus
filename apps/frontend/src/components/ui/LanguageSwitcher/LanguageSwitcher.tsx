import { useTranslation } from "react-i18next";
import {
	normalizeDetectedLanguage,
	supportedLanguages,
	type SupportedLanguage,
} from "@/common/i18n";

/** A select that switches the active language; the detector persists the choice. */
export const LanguageSwitcher = ({
	className = "",
}: {
	className?: string;
}): React.ReactElement => {
	const { i18n, t } = useTranslation();
	const labels: Record<SupportedLanguage, string> = {
		"en-US": t("auth.english"),
		"zh-CN": t("auth.chinese"),
	};
	const current = normalizeDetectedLanguage(i18n.resolvedLanguage ?? "en-US");
	return (
		<label
			className={`inline-flex items-center gap-2 text-xs text-ink/70 ${className}`}
		>
			{t("auth.language")}
			<select
				className="min-h-8 border border-rule bg-surface px-2 text-xs text-ink"
				value={current}
				onChange={(event) => {
					void i18n.changeLanguage(event.target.value);
				}}
			>
				{supportedLanguages.map((language) => (
					<option key={language} value={language}>
						{labels[language]}
					</option>
				))}
			</select>
		</label>
	);
};
