import { useTranslation } from "react-i18next";
import { drawingHooks, useSitesQuery } from "./data/hooks";
const formatBytes = (bytes: number) =>
	bytes < 1024 * 1024
		? `${Math.round(bytes / 1024)} KB`
		: `${(bytes / 1024 / 1024).toFixed(1)} MB`;
export const BlueprintSidebarStats = () => {
	const { t } = useTranslation();
	const { data: sites = [] } = useSitesQuery();
	const site = sites[0];
	const { data: drawings = [] } = drawingHooks.useList(site?.id ?? "");
	const total = drawings.reduce((sum, drawing) => sum + drawing.size_bytes, 0);
	return (
		<div
			aria-label={t("blueprints.sidebar.label")}
			className="border-t border-white/10 px-6 py-4 text-xs text-white/70"
		>
			<p>{t("blueprints.sidebar.drawings", { count: drawings.length })}</p>
			<p>{t("blueprints.sidebar.size", { size: formatBytes(total) })}</p>
		</div>
	);
};
