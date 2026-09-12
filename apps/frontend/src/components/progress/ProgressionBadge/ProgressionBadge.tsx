import { useTranslation } from "react-i18next";
/**
 * The Progression of a Unit, Storey, Block or Project: the plain average of
 * the Items beneath it as a whole-number percentage. With no Items it is
 * blank, never 0, and says "No Items" to assistive technology so that
 * "nothing defined" is never read as "nothing done".
 */
export const ProgressionBadge = ({
	progression,
	className = "",
}: {
	progression: number | null;
	className?: string;
}): React.ReactElement => {
	const { t } = useTranslation();
	return (
		<span
			className={`inline-flex min-h-6 min-w-12 shrink-0 items-center justify-center px-2 text-xs font-semibold tabular-nums ${
				progression === null ? "" : "border border-current"
			} ${className}`}
		>
			{progression === null ? (
				<span className="sr-only">{t("projects.progression.none")}</span>
			) : (
				`${Math.round(progression).toString()}%`
			)}
		</span>
	);
};
