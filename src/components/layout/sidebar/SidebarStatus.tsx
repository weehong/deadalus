import { useTranslation } from "react-i18next";

export interface SidebarStatusProps {
	syncTime: string;
	impairedServiceCount?: number;
}

export const SidebarStatus = ({
	syncTime,
	impairedServiceCount,
}: SidebarStatusProps) => {
	const { t } = useTranslation();

	return (
		<div className="border-t border-white/10 px-5 py-4 text-xs text-canvas/60">
			<div className="flex items-center justify-between gap-3">
				<span>{t("sidebar.lastSync")}</span>
				<time className="font-mono tabular-nums">{syncTime}</time>
			</div>
			{impairedServiceCount === undefined ? null : (
				<div className="mt-2 flex items-center gap-2 text-amber-400">
					<span
						aria-hidden="true"
						className="size-1.5 shrink-0 rounded-full bg-current"
					/>
					<span>
						{t("sidebar.servicesImpaired", {
							count: impairedServiceCount,
						})}
					</span>
				</div>
			)}
		</div>
	);
};
