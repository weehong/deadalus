import { useTranslation } from "react-i18next";

export const LanguageSwitcher = () => {
	const { i18n, t } = useTranslation();
	return (
		<label className="flex items-center gap-3 text-sm" htmlFor="language">
			<span>{t("auth.language")}</span>
			<select
				className="border border-rule bg-surface px-3 py-2 focus-visible:outline-2 focus-visible:outline-signal-500"
				id="language"
				value={i18n.resolvedLanguage === "zh-CN" ? "zh-CN" : "en-US"}
				onChange={(event) => void i18n.changeLanguage(event.target.value)}
			>
				<option value="en-US">{t("auth.english")}</option>
				<option value="zh-CN">{t("auth.chinese")}</option>
			</select>
		</label>
	);
};
 
